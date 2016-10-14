"""Unit tests for Caravel"""
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals

import os
import unittest

from flask_appbuilder.security.sqla import models as ab_models

import caravel
from caravel import app, db, models, utils, appbuilder, sm

os.environ['CARAVEL_CONFIG'] = 'tests.caravel_test_config'

BASE_DIR = app.config.get("BASE_DIR")


class CaravelTestCase(unittest.TestCase):

    def __init__(self, *args, **kwargs):
        super(CaravelTestCase, self).__init__(*args, **kwargs)
        self.client = app.test_client()
        self.maxDiff = None
        utils.init(caravel)

        admin = appbuilder.sm.find_user('admin')
        if not admin:
            appbuilder.sm.add_user(
                'admin', 'admin', ' user', 'admin@fab.org',
                appbuilder.sm.find_role('Admin'),
                password='general')

        gamma = appbuilder.sm.find_user('gamma')
        if not gamma:
            appbuilder.sm.add_user(
                'gamma', 'gamma', 'user', 'gamma@fab.org',
                appbuilder.sm.find_role('Gamma'),
                password='general')

        alpha = appbuilder.sm.find_user('alpha')
        if not alpha:
            appbuilder.sm.add_user(
                'alpha', 'alpha', 'user', 'alpha@fab.org',
                appbuilder.sm.find_role('Alpha'),
                password='general')

        # create druid cluster and druid datasources
        session = db.session
        cluster = session.query(models.DruidCluster).filter_by(
            cluster_name="druid_test").first()
        if not cluster:
            cluster = models.DruidCluster(cluster_name="druid_test")
            session.add(cluster)
            session.commit()

            druid_datasource1 = models.DruidDatasource(
                datasource_name='druid_ds_1',
                cluster_name='druid_test'
            )
            session.add(druid_datasource1)
            druid_datasource2 = models.DruidDatasource(
                datasource_name='druid_ds_2',
                cluster_name='druid_test'
            )
            session.add(druid_datasource2)
            session.commit()

        utils.init(caravel)

    def login(self, username='admin', password='general'):
        resp = self.client.post(
            '/login/',
            data=dict(username=username, password=password),
            follow_redirects=True)
        assert 'Welcome' in resp.data.decode('utf-8')

    def get_query_by_sql(self, sql):
        session = db.create_scoped_session()
        query = session.query(models.Query).filter_by(sql=sql).first()
        session.close()
        return query

    def get_latest_query(self, sql):
        session = db.create_scoped_session()
        query = (
            session.query(models.Query)
            .order_by(models.Query.id.desc())
            .first()
        )
        session.close()
        return query

    def get_access_requests(self, username, ds_type, ds_id):
            return db.session.query(models.DatasourceAccessRequest).filter(
                models.DatasourceAccessRequest.created_by_fk ==
                sm.find_user(username=username).id,
                models.DatasourceAccessRequest.datasource_type == ds_type,
                models.DatasourceAccessRequest.datasource_id == ds_id
            ).all()

    def logout(self):
        self.client.get('/logout/', follow_redirects=True)

    def test_welcome(self):
        self.login()
        resp = self.client.get('/caravel/welcome')
        assert 'Welcome' in resp.data.decode('utf-8')

    def setup_public_access_for_dashboard(self, table_name):
        public_role = appbuilder.sm.find_role('Public')
        perms = db.session.query(ab_models.PermissionView).all()
        for perm in perms:
            if (perm.permission.name == 'datasource_access' and
                    perm.view_menu and table_name in perm.view_menu.name):
                appbuilder.sm.add_permission_role(public_role, perm)

    def revoke_public_access(self, table_name):
        public_role = appbuilder.sm.find_role('Public')
        perms = db.session.query(ab_models.PermissionView).all()
        for perm in perms:
            if (perm.permission.name == 'datasource_access' and
                    perm.view_menu and table_name in perm.view_menu.name):
                appbuilder.sm.del_permission_role(public_role, perm)
